import { Button, Container, Grid, TextField } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import React, { useState } from "react";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const [user, setUser] = useState({ username: "", email: "", password: "" });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await axios.post(
      "http://localhost:4000/api/users/register",
      user
    );

    if (res.data) {
      setUser({ username: "", email: "", password: "" });
      router.push("/login");
    }
  };

  return (
    <Container maxWidth="lg">
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: "100vh" }}
      >
        <form onSubmit={handleSubmit}>
          <Grid
            item
            container
            direction="column"
            justifyContent="space-between"
            alignItems="center"
            spacing={4}
          >
            <Grid item>
              <TextField
                fullWidth
                type={"text"}
                label="Username"
                name="username"
                value={user.username}
                variant="outlined"
                required
                onChange={handleChange}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                type={"email"}
                label="Email"
                name="email"
                value={user.email}
                variant="outlined"
                required
                onChange={handleChange}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                type={"password"}
                label="Password"
                name="password"
                value={user.password}
                variant="outlined"
                required
                onChange={handleChange}
              />
            </Grid>
            <Grid item>
              <Button type="submit" size="large">
                Register
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>
    </Container>
  );
};

export default Register;
