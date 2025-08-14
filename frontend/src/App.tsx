import React, { useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

function App() {
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "testCollection"));
        querySnapshot.forEach((doc) => {
          console.log(doc.id, " => ", doc.data());
        });
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };
    fetchTest();
  }, []);

  return <div>Firebase frontend test</div>;
}

export default App;