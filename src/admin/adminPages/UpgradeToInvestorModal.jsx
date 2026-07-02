import { useState, useEffect, useRef } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaTimes, FaSearch, FaCheck } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import useClickOutside from "../../components/hooks/useClickOutside";

const SearchableMultiSelect = ({ label, options, selectedIds, onChange, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const dropdownRef = useRef(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const toggleOption = (id) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const displaySelected = selectedIds.length > 0
        ? options.filter(opt => selectedIds.includes(opt.id)).map(opt => opt.name).join(", ")
        : `Select ${label}`;

    return (
        <div className="relative" ref={dropdownRef}>
            <label className={`block text-xs font-semibold mb-1 uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {label}
            </label>
            <div
                className={`w-full p-2 rounded-lg border text-sm cursor-pointer flex justify-between items-center ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate pr-4">{displaySelected}</span>
                <span className="shrink-0">&#9662;</span>
            </div>

            {isOpen && (
                <div className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 flex flex-col ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200"}`}>
                    <div className={`p-2 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                        <div className={`flex items-center rounded px-2 py-1 ${isDark ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
                            <FaSearch className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                            <input
                                type="text"
                                className={`w-full bg-transparent border-none text-sm px-2 focus:outline-none ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                placeholder={`Search ${label}...`}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${selectedIds.includes(opt.id)
                                            ? (isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600")
                                            : (isDark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-700")
                                        }`}
                                    onClick={() => toggleOption(opt.id)}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.includes(opt.id) ? "bg-blue-500 border-blue-500" : (isDark ? "border-gray-600" : "border-gray-300")}`}>
                                        {selectedIds.includes(opt.id) && <FaCheck className="text-white text-2xs" />}
                                    </div>
                                    {opt.name}
                                </div>
                            ))
                        ) : (
                            <div className={`p-3 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                No matching {label.toLowerCase()} found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function UpgradeToInvestorModal({ isOpen, onClose, onSuccess, user, theme }) {
    const isDark = theme === "dark";
    const { showAlert } = useAlert();

    const [loading, setLoading] = useState(false);
    const [fetchingOptions, setFetchingOptions] = useState(false);

    const [industries, setIndustries] = useState([]);
    const [stages, setStages] = useState([]);

    const [formData, setFormData] = useState({
        display_name: "",
        one_liner: "",
        investment_thesis: "",
        focus_industries: [],
        preferred_stages: [],
        check_size_min: "",
        check_size_max: "",
        location: "",
        website_url: "",
        linkedin_url: "",
        twitter_url: "",
        investor_type: "angel"
    });

    useEffect(() => {
        if (isOpen && user) {
            fetchOptions();
            // Pre-fill display name based on user's existing name if available
            const defaultName = (user.first_name || user.last_name)
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : user.username;

            setFormData({
                display_name: defaultName,
                one_liner: "",
                investment_thesis: "",
                focus_industries: [],
                preferred_stages: [],
                check_size_min: "",
                check_size_max: "",
                location: "",
                website_url: "",
                linkedin_url: "",
                twitter_url: "",
                investor_type: "angel"
            });
        }
    }, [isOpen, user]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    const fetchOptions = async () => {
        try {
            setFetchingOptions(true);
            const [indRes, stageRes] = await Promise.all([
                axiosSecure.get("/v1/investors/industries/"),
                axiosSecure.get("/v1/investors/stages/")
            ]);
            setIndustries(indRes.data || []);
            setStages(stageRes.data || []);
        } catch (error) {
            console.error(error);
            showAlert("Failed to load industries/stages.", "error");
        } finally {
            setFetchingOptions(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Format check sizes and payload
            const payload = {
                ...formData,
                user_id: user.id,
                check_size_min: formData.check_size_min ? Number(formData.check_size_min) : null,
                check_size_max: formData.check_size_max ? Number(formData.check_size_max) : null
            };

            await axiosSecure.post("/v1/investors/admin/create-profile/", payload);
            showAlert("User successfully upgraded to investor!", "success");
            onSuccess();
        } catch (error) {
            console.error(error);
            showAlert(error.response?.data?.message || error.response?.data?.message || "Failed to upgrade user.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const inputClass = `w-full p-2 rounded-lg border text-sm ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-blue-500"} focus:outline-none transition-colors duration-200`;
    const labelClass = `block text-xs font-semibold mb-1 uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`relative w-full max-w-4xl flex flex-col max-h-full rounded-xl shadow-2xl overflow-hidden ${isDark ? "bg-[#111111] text-gray-100 border border-gray-800" : "bg-white text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={`p-5 flex justify-between items-center border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Upgrade User to Investor</h2>
                        <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Upgrading: @{user.username}</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}>
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {fetchingOptions ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading resources...</p>
                        </div>
                    ) : (
                        <form id="upgrade-investor-form" onSubmit={handleSubmit} className="space-y-6">

                            {/* Basic Profile */}
                            <div>
                                <h3 className={`text-sm font-semibold mb-3 border-b pb-2 ${isDark ? "border-gray-800 text-gray-300" : "border-gray-200 text-gray-700"}`}>Investor Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Display Name *</label>
                                        <input required name="display_name" value={formData.display_name} onChange={handleChange} className={inputClass} placeholder="Angel Capital" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Investor Type</label>
                                        <select name="investor_type" value={formData.investor_type} onChange={handleChange} className={inputClass}>
                                            <option value="angel">Angel Investor</option>
                                            <option value="vc">VC Firm</option>
                                            <option value="fund">Investment Fund</option>
                                            <option value="family_office">Family Office</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Location</label>
                                        <input name="location" value={formData.location} onChange={handleChange} className={inputClass} placeholder="Singapore" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>One Liner</label>
                                        <input name="one_liner" value={formData.one_liner} onChange={handleChange} className={inputClass} placeholder="Investing in AI startups" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Investment Thesis</label>
                                        <textarea name="investment_thesis" value={formData.investment_thesis} onChange={handleChange} className={`${inputClass} resize-none h-24`} placeholder="AI companies solving real-world problems..." />
                                    </div>
                                </div>
                            </div>

                            {/* Focus Areas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SearchableMultiSelect
                                    label="Focus Industries"
                                    options={industries}
                                    selectedIds={formData.focus_industries}
                                    onChange={(val) => setFormData(prev => ({ ...prev, focus_industries: val }))}
                                    isDark={isDark}
                                />
                                <SearchableMultiSelect
                                    label="Preferred Stages"
                                    options={stages}
                                    selectedIds={formData.preferred_stages}
                                    onChange={(val) => setFormData(prev => ({ ...prev, preferred_stages: val }))}
                                    isDark={isDark}
                                />
                            </div>

                            {/* Financial Details */}
                            <div>
                                <h3 className={`text-sm font-semibold mb-3 border-b pb-2 ${isDark ? "border-gray-800 text-gray-300" : "border-gray-200 text-gray-700"}`}>Check Size Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Check Size Min ($)</label>
                                        <input type="number" name="check_size_min" value={formData.check_size_min} onChange={handleChange} className={inputClass} placeholder="50000" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Check Size Max ($)</label>
                                        <input type="number" name="check_size_max" value={formData.check_size_max} onChange={handleChange} className={inputClass} placeholder="500000" />
                                    </div>
                                </div>
                            </div>

                            {/* Social / Links */}
                            <div>
                                <h3 className={`text-sm font-semibold mb-3 border-b pb-2 ${isDark ? "border-gray-800 text-gray-300" : "border-gray-200 text-gray-700"}`}>Links & Socials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Website URL</label>
                                        <input type="url" name="website_url" value={formData.website_url} onChange={handleChange} className={inputClass} placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className={labelClass}>LinkedIn URL</label>
                                        <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Twitter URL</label>
                                        <input type="url" name="twitter_url" value={formData.twitter_url} onChange={handleChange} className={inputClass} placeholder="https://twitter.com/..." />
                                    </div>
                                </div>
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="upgrade-investor-form"
                        className="px-5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                        Upgrade User
                    </button>
                </div>
            </div>
        </div>
    );
}
