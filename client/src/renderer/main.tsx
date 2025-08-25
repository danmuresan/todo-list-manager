import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Todo from './pages/Todo';

const router = createHashRouter([
    { path: '/', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/home', element: <Home /> },
    { path: '/todo/:listId/:todoId', element: <Todo /> }
]);

createRoot(document.getElementById('root')!)
    .render(<RouterProvider router={router} />);
