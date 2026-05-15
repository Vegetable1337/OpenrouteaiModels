import { createBrowserRouter } from "react-router";
import { ChatPage } from "./pages/ChatPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ChatPage,
  },
  {
    path: "/chat",
    Component: ChatPage,
  },
  {
    path: "/chat/:chatId",
    Component: ChatPage,
  },
  {
    path: "/project/:projectId",
    Component: ChatPage,
  },
  {
    path: "/project/:projectId/chat/:chatId",
    Component: ChatPage,
  },
  {
    path: "/x",
    Component: ChatPage,
  },
]);
