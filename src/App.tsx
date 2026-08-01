import { AuthGuard } from "@/layouts/AuthGuard";
import { AppLayout } from "@/layouts/AppLayout";
import { CardDetailPage } from "@/pages/CardDetailPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { CatalogSetPage } from "@/pages/CatalogSetPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { LoginPage } from "@/pages/LoginPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TradeChatPage } from "@/pages/TradeChatPage";
import { TradesPage } from "@/pages/TradesPage";
import { UserProfilePage } from "@/pages/UserProfilePage";
import { Navigate, Route, Routes } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:setId" element={<CatalogSetPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="/trades/chat/:threadId" element={<TradeChatPage />} />
          <Route path="/u/:uid" element={<UserProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/card/:id" element={<CardDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  );
}
