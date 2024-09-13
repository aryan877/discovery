"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, gql } from "@apollo/client";
import {
  ArrowLeft,
  Users,
  UserPlus,
  MessageSquare,
  Calendar,
  Award,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Back from "@/app/component/Back";

const GET_USER = gql`
  query GetUser($name: String!) {
    userByName(name: $name) {
      id
      username
      bio
      followerCount
      followingCount
      postCount
      iconUrl
      createdAt
      dscvrPoints
      streak {
        dayCount
        multiplierCount
      }
      wallets {
        address
        isPrimary
        walletType
        walletChainType
      }
    }
  }
`;

interface Wallet {
  address: string;
  isPrimary: boolean;
  walletType: string;
  walletChainType: string;
}

interface User {
  id: string;
  username: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  iconUrl: string | null;
  createdAt: string;
  dscvrPoints: string;
  streak: {
    dayCount: number;
    multiplierCount: number;
  };
  wallets: Wallet[];
}

interface UserData {
  userByName: User;
}

const UserProfile: React.FC = () => {
  const pathname = usePathname();
  const username = pathname?.split("/").pop();

  const { loading, error, data } = useQuery<UserData>(GET_USER, {
    variables: { name: username as string },
    skip: !username,
  });

  if (loading) return <p className="text-center ">Loading user profile...</p>;
  if (error)
    return <p className="text-center text-red-500">Error: {error.message}</p>;
  if (!data) return <p className="text-center ">No data found</p>;

  const user = data.userByName;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 bg-neutral-800 ">
      <Back />
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>

      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.iconUrl || undefined}
                alt={user.username}
              />
              <AvatarFallback className="bg-neutral-700 ">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="">{user.bio}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center ">
              <Users className="mr-2" size={16} />
              <span>{user.followerCount} Followers</span>
            </div>
            <div className="flex items-center ">
              <UserPlus className="mr-2" size={16} />
              <span>{user.followingCount} Following</span>
            </div>
            <div className="flex items-center ">
              <MessageSquare className="mr-2" size={16} />
              <span>{user.postCount} Posts</span>
            </div>
            <div className="flex items-center ">
              <Calendar className="mr-2" size={16} />
              <span>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <Separator className="my-6 bg-neutral-700" />

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2 ">
                <Award className=" mr-2" size={16} />
                DSCVR Points
              </h3>
              <p className="text-lg font-bold">
                {(parseInt(user.dscvrPoints) / 1_000_000).toLocaleString()}{" "}
                Points
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium flex items-center mb-2 ">
                <Award className=" mr-2" size={16} />
                Active Streak
              </h3>
              <p className="text-lg font-bold">
                {user.streak.dayCount} Days
                <span className="text-sm font-normal ml-2 ">
                  (x{user.streak.multiplierCount} Multiplier)
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium flex items-center mb-2 ">
                <Wallet className=" mr-2" size={16} />
                Wallets
              </h3>
              <div className="space-y-2">
                {user.wallets.map((wallet: Wallet, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-neutral-700 p-2 rounded-md"
                  >
                    <span className="font-mono text-sm ">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                    {wallet.isPrimary && (
                      <Badge
                        variant="secondary"
                        className="bg-neutral-600  text-xs"
                      >
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
