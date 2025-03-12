import Sidebar from "./components/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="p-4 flex-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome to Smart Tree Tagging System.</p>
      </div>
    </div>
  );
};

export default Dashboard;
