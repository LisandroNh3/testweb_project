import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.desde ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="card space-y-4 p-6 shadow-xl">
      <h2 className="text-lg font-semibold">Iniciar sesión</h2>
      <Alert type="error">{error}</Alert>
      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="username"
        value={form.email}
        onChange={cambiar}
        required
        autoFocus
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        value={form.password}
        onChange={cambiar}
        required
      />
      <Button type="submit" loading={enviando} className="w-full" size="lg">
        Entrar
      </Button>
    </form>
  );
}
