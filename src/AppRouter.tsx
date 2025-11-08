import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './routes/guard/RequireAuth';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AppShell from './components/layout/AppShell';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

