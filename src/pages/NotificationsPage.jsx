import React from "react";
import { NotificationCenter } from "../components/notifications/NotificationCenter";
import { FadeUp } from "../motion/FadeUp";

export const NotificationsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-28 lg:pb-12">
      <FadeUp>
        <NotificationCenter />
      </FadeUp>
    </div>
  );
};

export default NotificationsPage;
