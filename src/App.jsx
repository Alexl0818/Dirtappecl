import NewListing from "./components/NewListing";

import React, { useState } from "react";
import BuyerHome from "./components/BuyerHome";
import SellerDashboard from "./components/SellerDashboard";
import HaulerDashboard from "./components/HaulerDashboard";
import ProfileScreen from "./components/ProfileScreen";
import AIAssistant from "./components/AIAssistant";
import BottomNav from "./components/BottomNav";

function App() {
  const [activeTab, setActiveTab] = useState("sell");

  const renderScreen = () => {
    switch (activeTab) {
        case "newListing":
        return <NewListing onCancel={() => setActiveTab("sell")}
                           onCreate={(listing) => {
                             console.log("New listing:", listing);
                             setActiveTab("sell");
                           }} />;

      case "buy":
        return <BuyerHome />;
      case "sell":
        return <SellerDashboard />;
      case "haul":
        return <HaulerDashboard />;
      case "ai":
        return <AIAssistant />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <SellerDashboard />;
    }
  };

  return (
    <div className="app-root">
      <main className="app-main">{renderScreen()}</main>

      {/* IMPORTANT: pass the props BottomNav expects */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
    </div>
  );
}

export default App;
