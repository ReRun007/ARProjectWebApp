import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';


function Todo() {
    const [todo, setTodo] = useState("");
    const [todos, setTodos] = useState([]);

    const addTodo = async (e) => {
        e.preventDefault();

        try{
            const docRef = await addDoc(collection(db, "todos"),{
                todo: todo
            })
            console.log("Document written with ID: ",docRef.id);
        } catch(e){
            console.error("error adding todo:", e);
        }
    }


    const fetchPost = async () => {
        await getDocs(collection(db,"todos"))
                .then((querySnapshot) => {
                    const newData = querySnapshot.docs.map((doc) => ({...doc.data(), id: doc.id}));
                    setTodos(newData);
                })
    }


    useEffect(() => {
        fetchPost();
    }, []);

  return (
    <div>
        <h1>Todo-App</h1>
        <div>
            <input 
                type="text" 
                placeholder='List Todo' 
                onChange={(e) => setTodo(e.target.value)}
                />
                <button type="submit" onClick={addTodo}>
                    Submit
                </button>
        </div>

        <div>
            {/* แสดงผล */}
            {todos?.map((todo, i) => (
                <p key={i}>{todo.todo}</p>
            ))}
        </div>

    </div>
  )
}

export default Todo