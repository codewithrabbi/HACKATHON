"use client";

import { useState, useEffect } from "react";
import { User, Save, CheckCircle2, Globe, DollarSign, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import axios from "axios";

export default function SettingsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        
        // Check metadata or fallback to local storage
        if (user.user_metadata?.first_name) {
          setFirstName(user.user_metadata.first_name);
        } else {
          setFirstName(localStorage.getItem("user_first_name") || "Naimur");
        }
        
        if (user.user_metadata?.last_name) {
          setLastName(user.user_metadata.last_name);
        } else {
          setLastName(localStorage.getItem("user_last_name") || "Rahman");
        }
      } else {
        // Fallback for demo purposes if not logged in
        setFirstName(localStorage.getItem("user_first_name") || "Naimur");
        setLastName(localStorage.getItem("user_last_name") || "Rahman");
        setEmail(localStorage.getItem("user_email") || "user@example.com");
      }
    };
    
    fetchUser();
    
    // Load preferences
    setCurrency(localStorage.getItem("opspilot_currency") || "USD");
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save to local storage for quick access
    localStorage.setItem("user_first_name", firstName);
    localStorage.setItem("user_last_name", lastName);
    localStorage.setItem("opspilot_currency", currency);
    
    // Update Supabase user metadata
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName
        }
      });
    } else {
      localStorage.setItem("user_email", email);
    }
    
    setIsSaving(false);
    setShowSuccess(true);
    
    // Reload page after a delay to apply formatting changes globally
      setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete("http://localhost:8000/api/data/reset_all");
      setShowDeleteModal(false);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Failed to delete data. Check console for details.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-paper tracking-tight">Settings</h1>
        <p className="text-muted mt-2">Manage your personal profile information.</p>
      </div>

      <div className="animate-fade-in space-y-6">
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-brass" size={24} />
            <h2 className="text-xl font-display font-medium text-paper">Profile Information</h2>
          </div>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-surface to-surface2 border border-line flex items-center justify-center text-3xl font-display font-medium text-brass shadow-inner">
              {firstName.charAt(0)}{lastName.charAt(0)}
            </div>
            <div>
              <p className="text-paper font-medium mb-1">Avatar Display</p>
              <p className="text-sm text-muted">Your avatar is generated from your initials.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted">First Name</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-surface2/50 border border-line rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-brass transition-colors" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted">Last Name</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-surface2/50 border border-line rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-brass transition-colors" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface2/50 border border-line rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-brass transition-colors" 
              />
            </div>

          </div>

          <div className="mt-10 mb-6 flex items-center gap-3">
            <Globe className="text-brass" size={24} />
            <h2 className="text-xl font-display font-medium text-paper">Preferences</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted">Default Currency</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-surface2/50 border border-line rounded-xl px-4 py-2.5 text-paper focus:outline-none focus:border-brass transition-colors appearance-none"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
            <div>
              {showSuccess && (
                <div className="flex items-center gap-2 text-green-500 animate-fade-in">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">Profile updated successfully!</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-brass text-black font-medium rounded-xl hover:bg-brass/90 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 bg-red-950/20 border border-red-900/50 rounded-2xl p-6 md:p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-xl font-display font-medium text-red-500">Danger Zone</h2>
        </div>
        <p className="text-muted mb-6 text-sm">
          Once you delete your uploaded data, there is no going back. Please be certain. This will clear all sales, inventory, and insights from the database.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 font-medium rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
        >
          <Trash2 size={18} />
          Delete All Uploaded Data
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <h3 className="text-xl font-display font-medium text-white mb-2">Delete All Data?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This action cannot be undone. All your uploaded CSV data, including sales, inventory, customers, and generated AI insights will be permanently deleted from our servers.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? "Deleting..." : "Yes, delete everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
