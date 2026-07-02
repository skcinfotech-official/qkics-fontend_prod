import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { FaUsers, FaRegFileAlt, FaCheckCircle, FaUserTie, FaUserShield, FaArrowUp, FaChartLine } from "react-icons/fa";

export default function AdminDashboard() {
  const user = useSelector((state) => state.user.data);

  if (!user || (user.user_type !== "admin" && user.user_type !== "superadmin")) {
    return <Navigate to="/" />;
  }

  const role = user.user_type;

  const stats = [
    {
      title: "Total Users",
      value: "1,800",
      trend: "+12.5%",
      icon: <FaUsers className="text-xl" />,
    },
    {
      title: "Total Posts",
      value: "4,200",
      trend: "+8.2%",
      icon: <FaRegFileAlt className="text-xl" />,
    },
    {
      title: "Normal Users",
      value: "1,300",
      trend: "+5.1%",
      icon: <FaCheckCircle className="text-xl" />,
    },
    {
      title: "Expert Users",
      value: "300",
      trend: "+18.4%",
      icon: <FaUserTie className="text-xl" />,
    },
    {
      title: "Entrepreneurs",
      value: "200",
      trend: "+2.4%",
      icon: <FaUserShield className="text-xl" />,
    },
  ];

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {role === "superadmin" ? "Super Admin Overview" : "Dashboard Overview"}
          </h1>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-soft text-primary">
                {card.icon}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                <FaArrowUp className="text-2xs" /> {card.trend}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
              <h2 className="text-2xl font-bold mt-1 tracking-tight text-foreground">{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM SECTIONS (MOCK) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CHART AREA */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue Overview</h3>
            </div>
            <button className="p-2 rounded-md text-muted-foreground hover:bg-muted">
              <FaChartLine />
            </button>
          </div>
          {/* Mock Chart Body */}
          <div className="h-[20rem] rounded-lg flex items-center justify-center border border-border bg-muted/40">
            <span className="text-sm font-medium text-muted-foreground">Chart Data Unavailable</span>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-base font-semibold mb-6 text-foreground">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex relative">
                {i !== 5 && <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-border"></div>}
                <div className="relative z-10 w-4 h-4 rounded-full flex shrink-0 items-center justify-center mt-1 border-[3px] border-card bg-primary"></div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-foreground">New user signed up</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">john.doe@example.com • 2 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
