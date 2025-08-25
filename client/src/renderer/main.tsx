import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TodoLists from './pages/TodoListsManagement';
import Home from './pages/Home';
import TodoItemView from './pages/TodoItemView';

const router = createHashRouter([
    { path: '/', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/lists', element: <TodoLists /> },
    { path: '/home', element: <Home /> },
    { path: '/home/:listId', element: <Home /> },
    { path: '/todo/:listId/:todoId', element: <TodoItemView /> }
]);

createRoot(document.getElementById('root')!)
    .render(<RouterProvider router={router} />);
