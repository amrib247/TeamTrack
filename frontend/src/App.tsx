import React, { useEffect, useState } from "react";
import { apiService } from "./services/api";
import type { User } from "./types/User";
import { UserRole } from "./types/User";

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: UserRole.PLAYER,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError("Failed to load users");
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createUser(newUser);
      setNewUser({ email: "", firstName: "", lastName: "", role: UserRole.PLAYER });
      loadUsers(); // Reload the list
    } catch (err) {
      setError("Failed to create user");
      console.error("Error creating user:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiService.deleteUser(id);
      loadUsers(); // Reload the list
    } catch (err) {
      setError("Failed to delete user");
      console.error("Error deleting user:", err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>TeamTrack - Sports Team Management</h1>
      
      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

      <div style={{ marginBottom: "30px" }}>
        <h2>Add New User</h2>
        <form onSubmit={handleCreateUser} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <input
            type="text"
            placeholder="First Name"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            required
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            required
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.COACH}>Coach</option>
            <option value={UserRole.PLAYER}>Player</option>
            <option value={UserRole.PARENT}>Parent</option>
          </select>
          <button type="submit" style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Add User
          </button>
        </form>
      </div>

      <div>
        <h2>Users ({users.length})</h2>
        {users.length === 0 ? (
          <p>No users found. Add some users above!</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {users.map((user) => (
              <div key={user.id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{user.firstName} {user.lastName}</strong>
                  <br />
                  <small>{user.email}</small>
                  <br />
                  <span style={{ 
                    backgroundColor: user.role === UserRole.ADMIN ? "#dc3545" : 
                                  user.role === UserRole.COACH ? "#28a745" : 
                                  user.role === UserRole.PLAYER ? "#007bff" : "#6c757d",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  style={{ 
                    padding: "4px 8px", 
                    backgroundColor: "#dc3545", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;