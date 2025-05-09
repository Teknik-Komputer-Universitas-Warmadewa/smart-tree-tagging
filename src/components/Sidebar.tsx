import { FaSignOutAlt, FaTree } from "react-icons/fa";
import { MdQrCodeScanner } from "react-icons/md";
import { MdArrowBack } from "react-icons/md";
import { PiCowFill } from "react-icons/pi";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { useProject } from "../hook/useProject";

// Styled components for Sidebar
const SidebarContainer = styled.div`
  background-color: #1a1a1a;
  width: 200px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ddd;
  color: white;

  @media (max-width: 600px) {
    width: 60px;
    & > ul > li > a > span,
    & > ul > li > div > span,
    & > p {
      display: none;
    }
  }
`;

const SidebarTitle = styled.p`
  text-align: center;
  padding: 16px 0;
  color: white;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
`;

const SidebarList = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
  flex: 1;
`;

const SidebarItem = styled.li`
  width: 100%;
  transition: background-color 0.3s;

  & > a,
  & > div {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: white;
    text-decoration: none;
    font-size: 14px;
  }

  & > a.active {
    background-color: #43e8c7;
    color: #fff;
  }

  &:hover {
    background-color: #e0e0e0;
  }

  & .icon {
    margin-right: 8px;
    display: flex;
    align-items: center;
  }

  @media (max-width: 600px) {
    & > a,
    & > div {
      padding: 12px;
      justify-content: center;
    }
  }
`;

const Sidebar = () => {
  const { logout } = useUser();
  const { selectedProject } = useProject();

  return (
    <SidebarContainer>
      <div className=" flex items-center justify-evenly">
        <NavLink to="/">
          <div className="icon">
            <MdArrowBack size={20} />
          </div>
        </NavLink>
        <SidebarTitle>{selectedProject?.name.toUpperCase() || "Select Project"}</SidebarTitle>
      </div>
      <SidebarList>
        <SidebarItem>
          <NavLink to="record">
            <div className="icon">
              <MdQrCodeScanner size={20} />
            </div>
            <span>Pencatatan</span>
          </NavLink>
        </SidebarItem>
        <SidebarItem>
          <NavLink to="smart-tree-tagging">
            <div className="icon">
              <FaTree size={20} />
            </div>
            <span>Smart Tree</span>
          </NavLink>
        </SidebarItem>
        <SidebarItem>
          <NavLink to="smart-farm-tagging">
            <div className="icon">
              <PiCowFill size={20} />
            </div>
            <span>Smart Farm</span>
          </NavLink>
        </SidebarItem>
        <SidebarItem>
          <div className="flex items-center cursor-pointer" onClick={logout}>
            <div className="icon">
              <FaSignOutAlt size={20} />
            </div>
            <span>Logout</span>
          </div>
        </SidebarItem>
      </SidebarList>
    </SidebarContainer>
  );
};

export default Sidebar;
