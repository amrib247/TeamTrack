import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  deleteUser,
  type UserCredential
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
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { LoginRequest, RegisterRequest, AuthResponse, UpdateUserRequest } from '../types/Auth';

class FirebaseAuthService {
  
  /**
   * Register a new user with Firebase Authentication
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Create user in Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      
      await setDoc(doc(db, 'userProfiles', user.uid), userProfile);
      
      // Return user data in the expected format
      return {
        id: user.uid,
        email: user.email!,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        isActive: true,
        teams: []
      };
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }
  
  /**
   * Login user with Firebase Authentication
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Login attempt for:', credentials.email);
      
      // Sign in with Firebase Auth
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      const user = userCredential.user;
      console.log('Firebase Auth successful, UID:', user.uid);
      
      // Get user profile from Firestore
      console.log('Attempting to get profile for UID:', user.uid);
      console.log('Collection name being queried: userProfiles');
      
      // Try to get the profile document
      const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      
      console.log('Profile document exists:', userProfileDoc.exists());
      console.log('Profile document data:', userProfileDoc.data());
      
      // If profile not found, let's try to see what collections exist
      if (!userProfileDoc.exists()) {
        console.log('Profile not found, checking available collections...');
        try {
          // List all documents in userProfiles collection
          const collections = await getDocs(collection(db, 'userProfiles'));
          console.log('All documents in userProfiles collection:', collections.docs.map(doc => ({ id: doc.id, data: doc.data() })));
          
          // Also check if there's a 'users' collection (common alternative)
          try {
            const usersCollection = await getDocs(collection(db, 'users'));
            console.log('Documents in users collection:', usersCollection.docs.map(doc => ({ id: doc.id, data: doc.data() })));
          } catch (usersError) {
            console.log('No users collection found');
          }
          
        } catch (collectionError) {
          console.log('Error listing collections:', collectionError);
        }
        
        // Auto-create the missing profile using Firebase Auth data
        console.log('Auto-creating missing user profile...');
        try {
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
            isActive: true
          };
          
          await setDoc(doc(db, 'userProfiles', user.uid), userProfile);
          console.log('User profile created successfully');
          
          // Now get the created profile
          const createdProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          const createdProfile = createdProfileDoc.data()!;
          
          // Continue with teams retrieval
          console.log('Attempting to get teams for UID:', user.uid);
          const teamsQuery = query(
            collection(db, 'userTeams'), 
            where('userId', '==', user.uid)
          );
          const teamsSnapshot = await getDocs(teamsQuery);
          console.log('Teams query result:', teamsSnapshot.docs.length, 'teams found');
          
          const teams = teamsSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Team data:', data);
            return {
              id: doc.id,
              userId: data.userId,
              teamId: data.teamId,
              role: data.role,
              teamName: data.teamName || '',
              sport: data.sport || '',
              joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              isActive: data.isActive !== false,
              inviteAccepted: !!data.inviteAccepted
            };
          });
          
          console.log('Teams processed:', teams.length);
          
          // Return user data with created profile
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
            teams
          };
          
        } catch (createError) {
          console.error('Failed to create user profile:', createError);
          throw new Error('Failed to create user profile - please contact support');
        }
      }
      
      const userProfile = userProfileDoc.data();
      console.log('Profile retrieved successfully:', userProfile);
      
      // Get user's teams from Firestore
      console.log('Attempting to get teams for UID:', user.uid);
      const teamsQuery = query(
        collection(db, 'userTeams'), 
        where('userId', '==', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      console.log('Teams query result:', teamsSnapshot.docs.length, 'teams found');
      
      const teams = teamsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Team data:', data);
        return {
          id: doc.id,
          userId: data.userId,
          teamId: data.teamId,
          role: data.role,
          teamName: data.teamName || '',
          sport: data.sport || '',
          joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isActive: data.isActive !== false,
          inviteAccepted: !!data.inviteAccepted
        };
      });
      
      console.log('Teams processed:', teams.length);
      
      // Return user data in the expected format
      return {
        id: user.uid,
        email: user.email!,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNumber: userProfile.phoneNumber || '',
        dateOfBirth: userProfile.dateOfBirth,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        isActive: userProfile.isActive,
        teams
      };
      
    } catch (error: any) {
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // If it's a Firebase Auth error, use the specific message
      if (error.code && error.code.startsWith('auth/')) {
        throw new Error(this.getErrorMessage(error.code));
      }
      
      // For other errors, provide more context
      if (error.message === 'User profile not found') {
        throw new Error('User profile not found - please contact support');
      }
      
      throw new Error(`Login failed: ${error.message || 'Unknown error occurred'}`);
    }
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
      
      // If password is provided, verify it by re-authenticating
      if (userUpdateData.password) {
        try {
          await signInWithEmailAndPassword(auth, user.email!, userUpdateData.password);
        } catch (error: any) {
          if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect password');
          }
          throw new Error('Password verification failed');
        }
      }
      
      // Update user profile in Firestore
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const updateData: any = {};
      
      if (userUpdateData.firstName) updateData.firstName = userUpdateData.firstName;
      if (userUpdateData.lastName) updateData.lastName = userUpdateData.lastName;
      if (userUpdateData.phoneNumber !== undefined) updateData.phoneNumber = userUpdateData.phoneNumber;
      if (userUpdateData.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = userUpdateData.profilePhotoUrl;
      
      updateData.updatedAt = new Date().toISOString();
      
      await updateDoc(userProfileRef, updateData);
      
      // Get updated profile
      const updatedProfileDoc = await getDoc(userProfileRef);
      const updatedProfile = updatedProfileDoc.data()!;
      
      // Get user's teams
      const teamsQuery = query(
        collection(db, 'userTeams'), 
        where('userId', '==', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        teamId: doc.data().teamId,
        role: doc.data().role,
        teamName: doc.data().teamName || '',
        sport: doc.data().sport || '',
        joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        isActive: doc.data().isActive !== false,
        inviteAccepted: !!doc.data().inviteAccepted
      }));
      
      // Return updated user data
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
        teams
      };
      
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.message || 'Failed to update user profile');
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
      
      // Re-authenticate user to verify password
      await signInWithEmailAndPassword(auth, user.email!, password);
      
      // Call the backend API to delete account (this will trigger cascade deletion)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
      
      // Backend already deleted the user from Firebase Auth and Firestore
      // No need to delete again from Firebase Auth here
      
      return 'Account deleted successfully';
      
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      }
      throw new Error('Failed to delete account');
    }
  }
  
  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }
  
  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<AuthResponse | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      
      // Get user profile from Firestore
      const userProfileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      
      if (!userProfileDoc.exists()) {
        return null;
      }
      
      const userProfile = userProfileDoc.data();
      
      // Get user's teams
      const teamsQuery = query(
        collection(db, 'userTeams'), 
        where('userId', '==', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        teamId: doc.data().teamId,
        role: doc.data().role,
        teamName: doc.data().teamName || '',
        sport: doc.data().sport || '',
        joinedAt: doc.data().joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        isActive: doc.data().isActive !== false,
        inviteAccepted: !!doc.data().inviteAccepted
      }));
      
      // Return user data in the expected format
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
        teams
      };
      
    } catch (error: any) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  /**
   * Convert Firebase error codes to user-friendly messages
   */
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



