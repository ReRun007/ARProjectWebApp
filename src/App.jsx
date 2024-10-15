import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page when the component mounts
    navigate('/login');
  }, [navigate]);

  // This component doesn't render anything
  return null;
}

export default App