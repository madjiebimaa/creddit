import AppsIcon from "@mui/icons-material/Apps";
import HomeIcon from "@mui/icons-material/Home";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
interface NavBarProps {}

const BottomNav: React.FC<NavBarProps> = ({}) => {
  const [user, setUser] = useState({
    id: "",
    username: "",
    email: "",
    createdAt: "",
    updatedAt: "",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:4000/api/users", {
        withCredentials: true,
      });
      setUser({ ...res.data });
    };

    fetchData().catch((err) => {
      console.log(err);
    });
  }, []);

  const handleClickLogout = async () => {
    const res = await axios.post(
      "http://localhost:4000/api/users/logout",
      null,
      {
        withCredentials: true,
      }
    );

    router.reload();
  };

  let links = (
    <Box>
      <Link href={"/register"}>
        <BottomNavigationAction icon={<HowToRegIcon />} />
      </Link>
      <Link href={"/login"}>
        <BottomNavigationAction icon={<LoginIcon />} />
      </Link>
    </Box>
  );

  if (user.username !== "") {
    links = (
      <Box>
        <BottomNavigationAction icon={<AppsIcon />} />
        <BottomNavigationAction
          icon={<LogoutIcon />}
          onClick={handleClickLogout}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: 500 }}>
      <BottomNavigation showLabels>
        <Box>
          <Link href={"/"}>
            <BottomNavigationAction icon={<HomeIcon />} />
          </Link>
        </Box>
        {links}
      </BottomNavigation>
    </Box>
  );
};

export default BottomNav;
