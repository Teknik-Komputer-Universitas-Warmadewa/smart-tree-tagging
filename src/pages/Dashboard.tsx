import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";

const ContainerSidebarContainer = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const Pool = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/dashboard/smart-tree-tagging", { replace: true });
    }
  }, [location, navigate]);

  return (
    <ContainerSidebarContainer>
      <Sidebar />
      <Outlet />
    </ContainerSidebarContainer>
  );
};

export default Pool;
