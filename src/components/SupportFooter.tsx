import {
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function CourseSupportFooter() {
  const navigate = useNavigate();

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-[#FFF8F5] to-white p-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

        <div className="flex">
          <img src="http://localhost:5173/images/iels/listening.png" alt="" className="w-40 h-40 scale-120" />
          <div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Need Help Choosing the Right Course?
            </h3>

            <p className="text-gray-600 mt-2 max-w-4xl">
              Our study abroad experts are available to help you select the
              best course, explain fees, guide admissions, and answer any
              questions before you enroll.
            </p>

            <div className="flex flex-wrap items-center gap-5 mt-5 text-sm">

              <a
                href="tel:+919875863347"
                className="flex items-center gap-2 text-gray-700 hover:text-[#FF6A3D]"
              >
                <Phone className="w-4 h-4 text-[#FF6A3D]" />
                +91 9875863347


              </a>

              <a
                href="mailto:info@ooshasprep.com"
                className="flex items-center gap-2 text-gray-700 hover:text-[#FF6A3D]"
              >
                <Mail className="w-4 h-4 text-[#FF6A3D]" />
                info@ooshasprep.com
              </a>

              <a
                href="https://wa.me/919875863347"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-[#25D366]"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Trusted by thousands of students pursuing education abroad.
            </div>
          </div>
        </div>

        {/* Right */}


      </div>
    </div>
  );
}