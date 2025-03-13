import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";

const Container = styled.div`
  width: 100vw;

  display: flex;
`;

const Pool = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/dashboard/record", { replace: true });
    }
  }, [location, navigate]);

  return (
    <Container>
      <Sidebar />
      <Outlet />
    </Container>
  );
};

export default Pool;
