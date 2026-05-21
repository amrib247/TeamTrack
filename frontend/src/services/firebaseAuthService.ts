import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  sendEmailVerification,
  reload,
  type User,
  type UserCredential,
  type ActionCodeSettings,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { LoginRequest, RegisterRequest, AuthResponse, UpdateUserRequest } from '../types/Auth';
import { resolveNotificationPreferences } from './teamService';
import { EmailNotVerifiedError, type RegisterResult } from '../types/authErrors';

class FirebaseAuthService {
  private getVerificationActionCodeSettings(): ActionCodeSettings {
    const base = import.meta.env.BASE_URL || '/';
    const path = base.endsWith('/') ? `${base}auth` : `${base}/auth`;
    return {
      url: `${window.location.origin}${path}`,
      handleCodeInApp: false,
    };
  }

  /**
   * Reload auth state and force-refresh the ID token so Firestore rules
   * see request.auth.token.email_verified after the user clicks the email link.
   */
  private async refreshVerifiedAuthToken(user: User): Promise<boolean> {
    await reload(user);
    if (!user.emailVerified) {
      return false;
    }
    await user.getIdToken(true);
    return true;
  }

  private async requireVerifiedEmail(user: User): Promise<void> {
    const verified = await this.refreshVerifiedAuthToken(user);
    if (!verified) {
      throw new EmailNotVerifiedError(user.email ?? '');
    }
  }

  async sendVerificationEmail(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    await sendEmailVerification(user, this.getVerificationActionCodeSettings());
  }

  async checkEmailVerified(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }
    return this.refreshVerifiedAuthToken(user);
  }

  /**
   * Register a new user and send a verification email. User stays signed in to allow resend.
   */
  async register(userData: RegisterRequest): Promise<RegisterResult> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      const userProfile = {
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      await setDoc(doc(db, 'userProfiles', user.uid), userProfile);
      await sendEmailVerification(user, this.getVerificationActionCodeSettings());

      return {
        needsEmailVerification: true,
        email: userData.email,
      };
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const err = error as { code?: string };
      throw new Error(this.getErrorMessage(err.code ?? ''));
    }
  }

  /**
   * Login user with Firebase Authentication
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      await this.requireVerifiedEmail(user);

      const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));

      if (!userProfileDoc.exists()) {
        const userProfile = {
          uid: user.uid,
          email: user.email!,
          firstName: user.displayName?.split(' ')[0] || 'Unknown',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || 'User',
          phoneNumber: '',
          dateOfBirth: '',
          profilePhotoUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };

        await setDoc(doc(db, 'userProfiles', user.uid), userProfile);

        const createdProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        const createdProfile = createdProfileDoc.data()!;

        const teams = await this.fetchUserTeams(user.uid);

        return {
          id: user.uid,
          email: user.email!,
          firstName: createdProfile.firstName,
          lastName: createdProfile.lastName,
          phoneNumber: createdProfile.phoneNumber || '',
          dateOfBirth: createdProfile.dateOfBirth,
          profilePhotoUrl: createdProfile.profilePhotoUrl,
          createdAt: createdProfile.createdAt,
          updatedAt: createdProfile.updatedAt,
          isActive: createdProfile.isActive,
          teams,
        };
      }

      const userProfile = userProfileDoc.data()!;
      const teams = await this.fetchUserTeams(user.uid);

      return {
        id: user.uid,
        email: user.email!,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: userProfile.dateOfBirth,
        profilePhotoUrl: userProfile.profilePhotoUrl,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        isActive: userProfile.isActive,
        teams,
      };
    } catch (error: unknown) {
      if (error instanceof EmailNotVerifiedError) {
        throw error;
      }
      console.error('Login error:', error);
      const err = error as { code?: string; message?: string };
      if (err.code?.startsWith('auth/')) {
        throw new Error(this.getErrorMessage(err.code));
      }
      throw new Error(err.message || 'Login failed');
    }
  }

  private async fetchUserTeams(userId: string) {
    const teamsSnapshot = await getDocs(
      query(collection(db, 'userTeams'), where('userId', '==', userId))
    );

    return teamsSnapshot.docs.map((teamDoc) => {
      const data = teamDoc.data();
      const notifications = resolveNotificationPreferences({
        userId: data.userId,
        teamId: data.teamId,
        role: data.role,
        isActive: data.isActive !== false,
        inviteAccepted: !!data.inviteAccepted,
        emailNotificationsEnabled: data.emailNotificationsEnabled,
        reminderLeadTime: data.reminderLeadTime,
      });
      return {
        id: teamDoc.id,
        userId: data.userId,
        teamId: data.teamId,
        role: data.role,
        teamName: data.teamName || '',
        sport: data.sport || '',
        joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        isActive: data.isActive !== false,
        inviteAccepted: !!data.inviteAccepted,
        ...notifications,
      };
    });
  }

  /**
   * Update user profile
   */
  async updateUser(userUpdateData: UpdateUserRequest): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      await this.requireVerifiedEmail(user);

      if (userUpdateData.password) {
        try {
          await signInWithEmailAndPassword(auth, user.email!, userUpdateData.password);
        } catch (error: unknown) {
          const err = error as { code?: string };
          if (err.code === 'auth/wrong-password') {
            throw new Error('Incorrect password');
          }
          throw new Error('Password verification failed');
        }
      }

      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const updateData: Record<string, string> = {};

      if (userUpdateData.firstName) updateData.firstName = userUpdateData.firstName;
      if (userUpdateData.lastName) updateData.lastName = userUpdateData.lastName;
      if (userUpdateData.phoneNumber !== undefined) updateData.phoneNumber = userUpdateData.phoneNumber;
      if (userUpdateData.profilePhotoUrl !== undefined) {
        updateData.profilePhotoUrl = userUpdateData.profilePhotoUrl;
      }

      updateData.updatedAt = new Date().toISOString();

      await updateDoc(userProfileRef, updateData);

      const updatedProfileDoc = await getDoc(userProfileRef);
      const updatedProfile = updatedProfileDoc.data()!;
      const teams = await this.fetchUserTeams(user.uid);

      return {
        id: user.uid,
        email: user.email!,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phoneNumber: updatedProfile.phoneNumber || '',
        dateOfBirth: updatedProfile.dateOfBirth,
        profilePhotoUrl: updatedProfile.profilePhotoUrl,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
        isActive: updatedProfile.isActive,
        teams,
      };
    } catch (error: unknown) {
      console.error('Update user error:', error);
      const err = error as { message?: string };
      throw new Error(err.message || 'Failed to update user profile');
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { teamService } = await import('./teamService');
      const { tournamentService } = await import('./tournamentService');

      const safetyCheck = await teamService.checkCoachSafety(user.uid, 'DELETE_ACCOUNT');
      if (!safetyCheck.canProceed) {
        throw new Error(safetyCheck.message);
      }

      const canRemoveFromTournaments = await tournamentService.checkUserCanBeRemovedFromAllTournaments(
        user.uid
      );
      if (!canRemoveFromTournaments) {
        throw new Error(
          'Cannot delete account - you are the last organizer of one or more tournaments. Please invite other organizers or delete the tournaments first.'
        );
      }

      await signInWithEmailAndPassword(auth, user.email!, password);

      await teamService.removeAllTeamsForUser(user.uid);
      await tournamentService.cleanupUserOrganizerRelationships(user.uid);
      await tournamentService.cleanupUserRefereeRelationships(user.uid);
      await deleteDoc(doc(db, 'userProfiles', user.uid));
      await deleteUser(user);

      return 'Account deleted successfully';
    } catch (error: unknown) {
      console.error('Delete account error:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      }
      if (err.message?.includes('You are the only coach') || err.message?.includes('last organizer')) {
        throw error;
      }
      throw new Error(err.message || 'Failed to delete account');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get current user data (only for verified accounts)
   */
  async getCurrentUser(): Promise<AuthResponse | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }

      const verified = await this.refreshVerifiedAuthToken(user);
      if (!verified) {
        return null;
      }

      const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));

      if (!userProfileDoc.exists()) {
        return null;
      }

      const userProfile = userProfileDoc.data();
      const teams = await this.fetchUserTeams(user.uid);

      return {
        id: user.uid,
        email: user.email!,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: userProfile.dateOfBirth,
        profilePhotoUrl: userProfile.profilePhotoUrl,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        isActive: userProfile.isActive,
        teams,
      };
    } catch (error: unknown) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Email already registered';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/user-not-found':
        return 'Invalid email or password';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Authentication failed. Please try again';
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
