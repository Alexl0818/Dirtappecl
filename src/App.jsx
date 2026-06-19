import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";

import { GMAPS_KEY, hasMapsKey } from "./lib/maps";

import { AuthProvider } from "./components/AuthContext";
import { InquiryProvider } from "./components/InquiryContext";
import { SellerListingProvider } from "./components/SellerListingContext";
import { HaulBidProvider } from "./components/HaulBidContext";
import { MessageProvider } from "./components/MessageContext";

import WelcomeScreen from "./components/WelcomeScreen";
import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";
import ModeSelectScreen from "./components/ModeSelectScreen";

import BuyerHome from "./components/BuyerHome";
import BuyerRequest from "./components/BuyerRequest";
import BuyerRequests from "./components/BuyerRequests";
import BuyerRequestDetails from "./components/BuyerRequestDetails";
import BuyerBrowseListings from "./components/BuyerBrowseListings";
import BuyerListingDetails from "./components/BuyerListingDetails";
import BuyerMapView from "./components/BuyerMapView";

import SellerDashboard from "./components/SellerDashboard";
import NewListing from "./components/NewListing";
import ListingDetails from "./components/ListingDetails";
import SellerInquiryDetails from "./components/SellerInquiryDetails";

import HaulerDashboard from "./components/HaulerDashboard";
import HaulerHaulOpportunity from "./components/HaulerHaulOpportunity";

import ProfileScreen from "./components/ProfileScreen";
import MessageThread from "./components/MessageThread";

import ErrorBoundary from "./components/ErrorBoundary";

import "./App.css";

function AppInner() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/mode" element={<ModeSelectScreen />} />

      <Route path="/signup" element={<SignupScreen />} />

      {/* Buyer */}
      <Route path="/buyer/home" element={<BuyerHome />} />
      <Route path="/buyer/request" element={<BuyerRequest />} />
      <Route path="/buyer/request/:listingId" element={<BuyerRequest />} />
      <Route path="/buyer/requests" element={<BuyerRequests />} />
      <Route
        path="/buyer/browse"
        element={
          <ErrorBoundary>
            <BuyerBrowseListings />
          </ErrorBoundary>
        }
      />
      <Route path="/buyer/request-details" element={<BuyerRequestDetails />} />
      <Route
        path="/buyer/details/:listingId"
        element={
          <ErrorBoundary>
            <BuyerListingDetails />
          </ErrorBoundary>
        }
      />
      <Route
        path="/buyer/map"
        element={
          <ErrorBoundary>
            <BuyerMapView />
          </ErrorBoundary>
        }
      />

      {/* Seller */}
      <Route
        path="/seller/dashboard"
        element={
          <ErrorBoundary>
            <SellerDashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="/seller/new"
        element={
          <ErrorBoundary>
            <NewListing />
          </ErrorBoundary>
        }
      />
      <Route
        path="/seller/edit/:listingId"
        element={
          <ErrorBoundary>
            <NewListing />
          </ErrorBoundary>
        }
      />
      <Route
        path="/seller/listing"
        element={
          <ErrorBoundary>
            <ListingDetails />
          </ErrorBoundary>
        }
      />
      <Route
        path="/seller/inquiry/:listingId"
        element={
          <ErrorBoundary>
            <SellerInquiryDetails />
          </ErrorBoundary>
        }
      />

      {/* Hauler */}
      <Route
        path="/hauler/dashboard"
        element={
          <ErrorBoundary>
            <HaulerDashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="/hauler/opportunity/:oppId"
        element={
          <ErrorBoundary>
            <HaulerHaulOpportunity />
          </ErrorBoundary>
        }
      />

      {/* Profile + Messages */}
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/messages/thread" element={<MessageThread />} />

      {/* Catch-all: send unknown URLs back to the welcome screen */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const tree = (
    <AuthProvider>
      <InquiryProvider>
        <SellerListingProvider>
          <HaulBidProvider>
            <MessageProvider>
              <ErrorBoundary>
                <AppInner />
              </ErrorBoundary>
            </MessageProvider>
          </HaulBidProvider>
        </SellerListingProvider>
      </InquiryProvider>
    </AuthProvider>
  );

  // Load the Google Maps script app-wide only when a key is configured, so
  // geocoding works in the listing/request forms and the map screen renders.
  return hasMapsKey() ? (
    <APIProvider apiKey={GMAPS_KEY} libraries={["geocoding", "marker"]}>
      {tree}
    </APIProvider>
  ) : (
    tree
  );
}
