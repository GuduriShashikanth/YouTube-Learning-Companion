import { Navigate } from 'react-router-dom';

export default function AuthPage() {
  return <Navigate to="/signin" replace />;
}
