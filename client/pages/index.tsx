import { Container, Grid } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import BottomNav from "../components/NavBar";

interface indexProps {}

interface Post {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const Index: React.FC<indexProps> = ({}) => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:4000/api/posts");
    };

    fetchData().catch((err) => {
      console.log(err);
    });
  }, []);

  return (
    <Container maxWidth="lg">
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="space-between"
        style={{ minHeight: "85vh" }}
      >
        <Grid item></Grid>
      </Grid>
      <Grid container justifyContent="center">
        <Grid item>
          <BottomNav />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Index;
