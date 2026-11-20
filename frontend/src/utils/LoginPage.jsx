import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      } else {
        setMessage(err.message); // "Wrong username or password" or the unreachable message
      }
    }
  }

  // keep your own form markup and styling; show errors.username, errors.password and message
}