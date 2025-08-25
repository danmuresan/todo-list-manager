import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Lists from './pages/TodoLists';
import Home from './pages/Home';
import Todo from './pages/TodoItem';

const router = createHashRouter([
    { path: '/', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/lists', element: <Lists /> },
    { path: '/home', element: <Home /> },
    { path: '/home/:listId', element: <Home /> },
    { path: '/todo/:listId/:todoId', element: <Todo /> }
]);

createRoot(document.getElementById('root')!)
    .render(<RouterProvider router={router} />);
