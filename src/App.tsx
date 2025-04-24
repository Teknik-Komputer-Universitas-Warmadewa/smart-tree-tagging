import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import AppRoutes from "./AppRoutes";

import { ProjectProvider } from "./context/ProjectContext";
import "./index.css";

function App() {
  return (
    <UserProvider>
      <ProjectProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ProjectProvider>
    </UserProvider>
  );
}

export default App;
