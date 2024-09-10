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

interface ProfilePictureProps {
  iconUrl: string | null;
  username: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  iconUrl,
  username,
}) => {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={username}
        className="w-24 h-24 rounded-full border-2 border-gray-700"
      />
    );
  }

  const initials = username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
      <span className="text-2xl font-bold text-gray-300">{initials}</span>
    </div>
  );
};

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

  if (loading)
    return <p className="text-center text-gray-400">Loading user profile...</p>;
  if (error)
    return <p className="text-center text-red-500">Error: {error.message}</p>;
  if (!data) return <p className="text-center text-gray-400">No data found</p>;

  const user = data.userByName;

  return (
    <div className="bg-black min-h-screen text-gray-300">
      <div className="max-w-4xl mx-auto p-6">
        <Link
          href="/"
          className="mb-8 text-gray-400 hover:text-gray-200 inline-flex items-center transition-colors duration-200"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Transfer
        </Link>

        <div className="bg-gray-900 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center mb-8">
            <ProfilePicture iconUrl={user.iconUrl} username={user.username} />
            <div className="ml-6">
              <h2 className="text-3xl font-bold text-gray-100">
                {user.username}
              </h2>
              <p className="text-gray-400 mt-2">{user.bio}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="flex items-center">
              <Users className="text-gray-500 mr-2" size={20} />
              <span>{user.followerCount} Followers</span>
            </div>
            <div className="flex items-center">
              <UserPlus className="text-gray-500 mr-2" size={20} />
              <span>{user.followingCount} Following</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="text-gray-500 mr-2" size={20} />
              <span>{user.postCount} Posts</span>
            </div>
            <div className="flex items-center">
              <Calendar className="text-gray-500 mr-2" size={20} />
              <span>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="text-gray-400 mr-2" size={24} />
              DSCVR Points
            </h3>
            <p className="text-2xl font-bold text-gray-100">
              {(parseInt(user.dscvrPoints) / 1_000_000).toLocaleString()} Points
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="text-gray-400 mr-2" size={24} />
              Active Streak
            </h3>
            <p className="text-2xl font-bold text-gray-100">
              {user.streak.dayCount} Days
              <span className="text-lg font-normal ml-2 text-gray-400">
                (x{user.streak.multiplierCount} Multiplier)
              </span>
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Wallet className="text-gray-400 mr-2" size={24} />
              Wallets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.wallets.map((wallet: Wallet, index: number) => (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
                >
                  <span className="font-mono text-gray-300">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                  {wallet.isPrimary && (
                    <span className="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
