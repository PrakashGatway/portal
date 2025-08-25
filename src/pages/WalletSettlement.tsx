import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

const EWalletToMainWalletSettlement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalance, setUserBalance] = useState({ eWallet: 0, mainWallet: 0 });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      amount: "",
      remarks: "",
    },
  });

  const navigate = useNavigate();
  const amount = watch("amount");

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
      setUserBalance({
        eWallet: user.eWalletBalance || 0,
        mainWallet: user.upiWalletBalance || 0
      });
      setValue("remarks", `Settlement from ${user.fullName || user.userName}`);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    if (parseFloat(data.amount) > userBalance.eWallet) {
      toast.error(`Insufficient balance. User has ₹${userBalance.eWallet.toFixed(2)} in E-Wallet`);
      return;
    }

    try {
      const payload = {
        userId: selectedUser._id,
        amount: parseFloat(data.amount),
        remarks: data.remarks
      };

      const response = await api.post("/auth/settlement/wallet", payload);

      if (response.data.success) {
        toast.success("Funds transferred successfully!");
        reset();
        setSelectedUser(null);
        navigate("/");
      } else {
        toast.error(response.data.message || "Transfer failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Transfer failed. Please try again later."
      );
    }
  };

  const projectedBalances = {
    eWallet: userBalance.eWallet - (parseFloat(amount) || 0),
    mainWallet: userBalance.mainWallet + (parseFloat(amount) || 0)
  };

  return (
    <div>
      <PageMeta
        title="E-Wallet to Main Wallet Transfer"
        description="Transfer funds between user wallets"
      />
      <PageBreadcrumb
        pageTitle="E-Wallet to Main Wallet Transfer"
      />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-6 xl:py-6">
        <div className="max-w-full mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Selection */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Select User
              </h3>
              
              <div className="mb-4">
                <label className="block  font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search User
                </label>
                <select
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.fullName || user.userName} ({user.email}) - 
                      E-Wallet: ₹{user.eWalletBalance?.toFixed(2) || '0.00'} | 
                      Main: ₹{user.upiWalletBalance?.toFixed(2) || '0.00'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-md">
                      <p className=" text-gray-500 dark:text-gray-300">User</p>
                      <p className="font-medium">{selectedUser.fullName || selectedUser.userName}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-md">
                      <p className=" text-gray-500 dark:text-gray-300">User ID</p>
                      <p className="font-medium">{selectedUser.userId || selectedUser.clientId}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-md">
                      <p className=" text-gray-500 dark:text-gray-300">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUser.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                      <p className=" font-medium text-blue-800 dark:text-blue-200">Current E-Wallet Balance</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                        ₹{userBalance.eWallet.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md">
                      <p className=" font-medium text-purple-800 dark:text-purple-200">Current Main Wallet Balance</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                        ₹{userBalance.mainWallet.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Details */}
            {selectedUser && (
              <>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Transfer Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="amount" className="block  font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount to Transfer (₹)
                      </label>
                      <input
                        id="amount"
                        type="number"
                        className={`w-full rounded-lg border ${errors.amount ? "border-red-500" : "border-gray-300"} px-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                        {...register("amount", {
                          required: "Amount is required",
                          min: {
                            value: 1,
                            message: "Minimum transfer amount is ₹1",
                          },
                          max: {
                            value: userBalance.eWallet,
                            message: `Cannot exceed E-Wallet balance (₹${userBalance.eWallet.toFixed(2)})`,
                          },
                          valueAsNumber: true,
                        })}
                        placeholder="0.00"
                        step="0.01"
                      />
                      {errors.amount && (
                        <p className="mt-2  text-red-600">{errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="remarks" className="block  font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Remarks
                      </label>
                      <input
                        id="remarks"
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        {...register("remarks")}
                        placeholder="Transaction remarks"
                      />
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Transfer Summary
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-600 p-4 rounded-md">
                        <p className=" text-gray-500 dark:text-gray-300">Amount to Transfer</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                          ₹{amount || "0.00"}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className=" font-medium">Current E-Wallet:</span>
                          <span className="font-medium">₹{userBalance.eWallet.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className=" font-medium">After Transfer:</span>
                          <span className={`font-medium ${
                            projectedBalances.eWallet < 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            ₹{projectedBalances.eWallet.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className=" font-medium">Current Main Wallet:</span>
                          <span className="font-medium">₹{userBalance.mainWallet.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className=" font-medium">After Transfer:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₹{projectedBalances.mainWallet.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {parseFloat(amount) > userBalance.eWallet && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <p className="text-red-600 dark:text-red-400 ">
                          Warning: This transfer will exceed the user's E-Wallet balance
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !amount || parseFloat(amount) > userBalance.eWallet}
                    className={`inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-w-[200px] ${
                      isSubmitting || !amount || parseFloat(amount) > userBalance.eWallet
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
                        Processing Transfer
                      </>
                    ) : (
                      "Confirm Transfer"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EWalletToMainWalletSettlement;