"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Wallet, Plus, History, ArrowUpRight, MessageCircle, Copy, Check } from "lucide-react";

interface BalanceTransaction {
  id: string;
  amount: number;
  type: "DEPOSIT" | "PURCHASE";
  description: string;
  createdAt: string;
}

export default function BalancePage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [copiedWalletNumber, setCopiedWalletNumber] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"VODAFONE_CASH" | "INSTAPAY">(
    "VODAFONE_CASH"
  );

  const isStudent = session?.user?.role === "STUDENT";
  
  const vodafoneCashNumber = "01028462194";
  const instaPayNumber = "01148492847";
  const customerServicePhone = "01148492847";
  const whatsappLink = `https://wa.me/20${customerServicePhone.replace(/^0/, "")}`;
  const depositWalletNumber =
    selectedPaymentMethod === "VODAFONE_CASH" ? vodafoneCashNumber : instaPayNumber;

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/user/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/balance/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleAddBalance = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/balance/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.newBalance);
        setAmount("");
        toast.success("Balance updated successfully");
        fetchTransactions();
      } else {
        const error = await response.text();
        toast.error(error || "Something went wrong while adding balance");
      }
    } catch (error) {
      console.error("Error adding balance:", error);
      toast.error("Something went wrong while adding balance");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string, setCopiedState: (value: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedState(false), 2000);
  };

  const formatTransactionDescription = (t: BalanceTransaction) => {
    if (t.description.includes("Added") && t.type === "DEPOSIT") {
      return t.description.replace(
        /Added (\d+(?:\.\d+)?) EGP to balance/,
        "Added $1 EGP to balance"
      );
    }
    if (t.description.includes("Purchased course:") && t.type === "PURCHASE") {
      return t.description.replace(/Purchased course: (.+)/, "Purchased course: $1");
    }
    return t.description;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance</h1>
          <p className="text-muted-foreground">
            {isStudent 
              ? "View your account balance and transaction history" 
              : "Add credit to purchase courses"
            }
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account balance
          </CardTitle>
          <CardDescription>
            Available balance in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-brand">
            {balance.toFixed(2)} EGP
          </div>
        </CardContent>
      </Card>

      {!isStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add balance
            </CardTitle>
            <CardDescription>
              Deposit an amount to your wallet (staff / testing)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                className="flex-1"
              />
              <Button 
                onClick={handleAddBalance}
                disabled={isLoading}
                className="bg-brand text-white hover:bg-brand/90"
              >
                {isLoading ? "Adding..." : "Add balance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isStudent && (
        <Card className="border-brand/20 bg-brand/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-brand" />
              Top up via Vodafone Cash or InstaPay
            </CardTitle>
            <CardDescription>
              Choose a method, transfer to the number below, then send a screenshot of the receipt to customer support on WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-sm font-semibold mb-2">Payment method</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={selectedPaymentMethod === "VODAFONE_CASH" ? "default" : "outline"}
                  onClick={() => setSelectedPaymentMethod("VODAFONE_CASH")}
                  className={selectedPaymentMethod === "VODAFONE_CASH" ? "bg-brand text-white hover:bg-brand/90" : ""}
                >
                  Vodafone Cash
                </Button>
                <Button
                  type="button"
                  variant={selectedPaymentMethod === "INSTAPAY" ? "default" : "outline"}
                  onClick={() => setSelectedPaymentMethod("INSTAPAY")}
                  className={selectedPaymentMethod === "INSTAPAY" ? "bg-brand text-white hover:bg-brand/90" : ""}
                >
                  InstaPay
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedPaymentMethod === "VODAFONE_CASH"
                  ? "Send the amount from the Vodafone Cash app"
                  : "Send the amount from the InstaPay app"}
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 border-2 border-brand/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedPaymentMethod === "VODAFONE_CASH" ? "Vodafone Cash number" : "InstaPay number"}
                  </p>
                  <p className="text-2xl font-bold text-brand">{depositWalletNumber}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(depositWalletNumber, setCopiedWalletNumber)}
                  className="h-10 w-10"
                >
                  {copiedWalletNumber ? (
                    <Check className="h-4 w-4 text-brand" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm">
                Method: {selectedPaymentMethod === "VODAFONE_CASH" ? "Vodafone Cash" : "InstaPay"}
              </p>
              <p className="font-semibold text-sm">How to deposit:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  Open {selectedPaymentMethod === "VODAFONE_CASH" ? "Vodafone Cash" : "InstaPay"} and transfer the amount
                  to the number above
                </li>
                <li>Save a screenshot of the receipt from the app</li>
                <li>Tap “Send receipt on WhatsApp” below</li>
                <li>We will review and credit your balance within 24 hours</li>
              </ol>
            </div>

            <Button
              asChild
              className="w-full bg-brand hover:bg-brand/90 text-white"
              size="lg"
            >
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                Send receipt on WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction history
          </CardTitle>
          <CardDescription>
            Full history of balance changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === "DEPOSIT" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-red-100 text-red-600"
                    }`}>
                      {transaction.type === "DEPOSIT" ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatTransactionDescription(transaction)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.type === "DEPOSIT" ? "Deposit" : "Course purchase"}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.type === "DEPOSIT" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "DEPOSIT" ? "+" : "-"}
                    {Math.abs(transaction.amount).toFixed(2)} EGP
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
