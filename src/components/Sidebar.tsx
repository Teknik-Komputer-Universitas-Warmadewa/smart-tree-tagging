import { FaSignOutAlt, FaTree } from "react-icons/fa";
import { MdQrCodeScanner } from "react-icons/md";
import { PiCowFill } from "react-icons/pi";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";

const Container = styled.div`
  background-color: rgb(238, 238, 238);
  width: 240px;
  height: 100vh;

  @media only screen and (max-width: 600px) {
    width: 40px;
    & > ul {
      & > li {
        padding: 10px !important;
        & > a {
          & > span {
            display: none;
          }
        }
      }
      & > li {
        padding: 10px !important;
        & > div {
          & > span {
            display: none;
          }
        }
      }
    }
  }

  @media only screen and (max-width: 830px) {
    /* height: calc(100vh - 100px); */

    & > p {
      padding: 20px;
    }
  }

  & > p {
    text-align: center;
    padding: 8px;
    color: #1717174f;
  }

  & > ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    width: 100%;

    & > li {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 10px;
      transition: color 0.3s;
      border-bottom: 1px solid black;

      & > a {
        width: 100%;
        display: block;
        display: flex;

        & > .icon {
          height: 24px;
          display: flex;
          align-items: center;
        }

        &.active {
          color: #43e8c7;
        }
      }
    }

    & > li:hover {
      color: #43e8c7;
    }
  }
`;

const Sidebar = () => {
  const { logout } = useUser();

  return (
    <Container>
      <p className=" text-gray-800">WIOT</p>
      <ul>
        <li className=" mt-10">
          <NavLink to="record">
            <div className="icon">
              <MdQrCodeScanner size={23} />
            </div>
            <span className="ml-3">Pencatatan</span>
          </NavLink>
        </li>
        <li className="">
          <NavLink to="smart-tree-tagging">
            <div className="icon">
              <FaTree size={23} />
            </div>
            <span className="ml-3">Smart Tree</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="smart-farm-tagging">
            <div className="icon">
              <PiCowFill size={23} />
            </div>
            <span className="ml-3">Smart Farm</span>
          </NavLink>
        </li>

        <li>
          <div className="flex items-center cursor-pointer" onClick={logout}>
            <div className="icon">
              <FaSignOutAlt size={23} />
            </div>
            <span className="ml-3">Logout</span>
          </div>
        </li>
      </ul>
    </Container>
  );
};

export default Sidebar;
