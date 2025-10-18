import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/auth';
import { colors } from '../../styles/GlobalStyles';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.background};
`;

const LoginCard = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 48px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${colors.primary};
  text-align: center;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const Button = styled.button`
  padding: 12px;
  background-color: ${colors.primary};
  color: ${colors.white};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background-color: #fee;
  color: ${colors.primary};
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
`;

const LinkText = styled.div`
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: ${colors.text.secondary};

  a {
    color: ${colors.primary};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>Asana Clone</Logo>
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <FormGroup>
            <Label>メールアドレス</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@company.com"
            />
          </FormGroup>
          <FormGroup>
            <Label>パスワード</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="パスワードを入力"
            />
          </FormGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </Form>
        <LinkText>
          アカウントをお持ちでない方は <Link to="/register">新規登録</Link>
        </LinkText>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
