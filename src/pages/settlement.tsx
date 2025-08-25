import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

const EWalletToBankSettlement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [users, setUsers] = useState([]);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      amount: "",
      gatewayCharge: "",
      gateway: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      upiId: "",
      mobileNumber: "",
      utr: "",
      remarks: "",
    },
  });

  const navigate = useNavigate();
  const amount = watch("amount");
  const gatewayCharge = watch("gatewayCharge");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data?.users || []);
    } catch (error) {
      toast.error("Failed to load users");
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u._id === userId);
    setSelectedUser(user);
    
    if (user) {
      setUserBalance(user.eWalletBalance || 0);
      
      if (user.bankDetails) {
        setHasBankDetails(true);
        setValue("accountHolderName", user.bankDetails.accountHolderName || "");
        setValue("accountNumber", user.bankDetails.accountNumber || "");
        setValue("ifscCode", user.bankDetails.ifscCode || "");
        setValue("bankName", user.bankDetails.bankName || "");
        setValue("mobileNumber", user.mobileNumber || "");
      } else {
        setHasBankDetails(false);
        reset({
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          bankName: "",
        });
      }
    }
  };

  const totalDeduction = (parseFloat(amount) || 0) + (parseFloat(gatewayCharge) || 0);

  const onSubmit = async (data) => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    if (!hasBankDetails && (!data.accountNumber || !data.ifscCode)) {
      toast.error("Bank details are required");
      return;
    }

    if (totalDeduction > userBalance) {
      toast.error(`Insufficient balance. User has ₹${userBalance.toFixed(2)} but needs ₹${totalDeduction.toFixed(2)}`);
      return;
    }

    try {
      const payload = {
        ...data,
        userId: selectedUser._id,
        amount: parseFloat(data.amount),
        gatewayCharge: parseFloat(data.gatewayCharge),
      };

      const response = await api.post("/auth/settlement/bank", payload);

      if (response.data.success) {
        toast.success("Bank settlement processed successfully!");
        reset();
        setSelectedUser(null);
        navigate("/");
      } else {
        toast.error(response.data.message || "Settlement failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Settlement failed. Please try again later."
      );
    }
  };

  return (
    <div>
      <PageMeta
        title="Admin Bank Settlement"
        description="Process bank settlements for users"
      />
      <PageBreadcrumb
        pageTitle="Admin Bank Settlement"
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-6 xl:py-6">
        <div className="w-full mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Selection */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                User Information
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select User
                </label>
                <select
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-3 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.userName} ({user.email}) - ₹{user.eWalletBalance?.toFixed(2) || '0.00'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">Name</p>
                      <p className="font-medium">{selectedUser.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">User ID</p>
                      <p className="font-medium">{selectedUser.userId || selectedUser.clientId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">Mobile</p>
                      <p className="font-medium">{selectedUser.mobileNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">E-Wallet Balance</p>
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">
                        ₹{selectedUser.eWalletBalance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {selectedUser.bankDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Saved Bank Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Account Holder</p>
                          <p>{selectedUser.bankDetails.accountHolderName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Account Number</p>
                          <p>••••{selectedUser.bankDetails.accountNumber?.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">IFSC Code</p>
                          <p>{selectedUser.bankDetails.ifscCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Bank Name</p>
                          <p>{selectedUser.bankDetails.bankName}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transaction Details */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Transaction Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    className={`w-full rounded-md border ${errors.amount ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("amount", {
                      required: "Amount is required",
                      min: {
                        value: 1,
                        message: "Minimum amount is ₹1",
                      },
                      max: {
                        value: userBalance,
                        message: `Cannot exceed user balance (₹${userBalance.toFixed(2)})`,
                      },
                      valueAsNumber: true,
                    })}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="gatewayCharge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gateway Charge (₹)
                  </label>
                  <input
                    id="gatewayCharge"
                    type="number"
                    className={`w-full rounded-md border ${errors.gatewayCharge ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("gatewayCharge", {
                      required: "Gateway charge is required",
                      min: {
                        value: 0,
                        message: "Charge cannot be negative",
                      },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.gatewayCharge && (
                    <p className="mt-1 text-sm text-red-600">{errors.gatewayCharge.message}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Deduction</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      ₹{totalDeduction.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      Current Balance: ₹{userBalance.toFixed(2)}
                    </p>
                    <p className={`text-sm ${
                      totalDeduction > userBalance 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      After Transaction: ₹{(userBalance - totalDeduction).toFixed(2)}
                    </p>
                  </div>
                </div>
                {totalDeduction > userBalance && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Warning: This transaction exceeds the user's available balance
                  </p>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bank Transfer Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    id="accountHolderName"
                    type="text"
                    className={`w-full rounded-md border ${errors.accountHolderName ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("accountHolderName", {
                      required: "Account holder name is required",
                    })}
                    placeholder="As per bank records"
                  />
                  {errors.accountHolderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountHolderName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    className={`w-full rounded-md border ${errors.accountNumber ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("accountNumber", {
                      required: "Account number is required",
                      minLength: {
                        value: 9,
                        message: "Account number must be at least 9 digits",
                      },
                      maxLength: {
                        value: 18,
                        message: "Account number cannot exceed 18 digits",
                      },
                    })}
                    placeholder="Bank account number"
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    id="ifscCode"
                    type="text"
                    className={`w-full rounded-md border ${errors.ifscCode ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("ifscCode", {
                      required: "IFSC code is required",
                      pattern: {
                        value: /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/,
                        message: "Invalid IFSC code format (e.g., ABCD0123456)",
                      },
                      onChange: (e) => fetchBankName(e.target.value),
                    })}
                    placeholder="Bank IFSC code"
                  />
                  {errors.ifscCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.ifscCode.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    className={`w-full rounded-md border ${errors.bankName ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("bankName", {
                      required: "Bank name is required",
                    })}
                    placeholder="Bank name"
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    id="mobileNumber"
                    type="text"
                    className={`w-full rounded-md border ${errors.mobileNumber ? "border-red-500" : "border-gray-300"} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                    {...register("mobileNumber", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Invalid mobile number (10 digits required)",
                      },
                    })}
                    placeholder="Registered mobile number"
                  />
                  {errors.mobileNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobileNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UPI ID (Optional)
                  </label>
                  <input
                    id="upiId"
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    {...register("upiId")}
                    placeholder="UPI ID for instant transfer"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="utr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UTR/Reference Number
                  </label>
                  <input
                    id="utr"
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    {...register("utr")}
                    placeholder="Transaction reference number"
                  />
                </div>

                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Remarks
                  </label>
                  <input
                    id="remarks"
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    {...register("remarks")}
                    placeholder="Any additional notes"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !selectedUser || totalDeduction > userBalance}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isSubmitting || !selectedUser || totalDeduction > userBalance
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Process Settlement"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EWalletToBankSettlement;