import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Link } from 'react-router-dom'
import Todo from './components/Todo'

function App() {

  return (
    <>
      <h3>Wellcom</h3>
      <img src={reactLogo} alt="" />
      <br /><br />
      <Link to="/login" className='btn btn-success'>Login</Link>
      <Link to="/register" className='btn btn-primary'>Register</Link>
      <Todo />
      <Link to="/dashboard" className='btn btn-primary'>แดชบอร์ด</Link>
    </>
  )
}

export default App
