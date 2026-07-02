import { FaGraduationCap, FaUser, FaBriefcase } from "react-icons/fa";
import { IoIosRocket } from "react-icons/io";

export default function UserBadge({ userType }) {
    switch (userType) {
        case "expert":
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-xl text-2xs font-bold uppercase tracking-wider border transition-all border-purple-400 bg-purple-400/10 text-purple-600 dark:border-purple-500 dark:bg-purple-500/20 dark:text-purple-300">
                    <FaGraduationCap className="mr-1 text-xs" /> Expert
                </span>
            );
        case "entrepreneur":
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-xl text-2xs font-bold uppercase tracking-wider border transition-all border-orange-400 bg-orange-400/10 text-orange-600 dark:border-orange-500 dark:bg-orange-500/20 dark:text-orange-300">
                    <IoIosRocket className="mr-1 text-xs" /> Entrepreneur
                </span>
            );
        case "investor":
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-xl text-2xs font-bold uppercase tracking-wider border transition-all border-red-400 bg-red-400/10 text-red-600 dark:border-red-500 dark:bg-red-500/20 dark:text-red-300">
                    <FaBriefcase className="mr-1 text-xs" /> Investor
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-xl text-2xs font-bold uppercase tracking-wider border transition-all border-gray-400 bg-gray-400/10 text-gray-600 dark:border-gray-500 dark:bg-gray-500/20 dark:text-gray-300">
                    <FaUser className="mr-1 text-xs" /> Normal
                </span>
            );
    }
}
