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

  if (loading)
    return (
      <p className="text-center text-muted-foreground">
        Loading user profile...
      </p>
    );
  if (error)
    return (
      <p className="text-center text-destructive">Error: {error.message}</p>
    );
  if (!data)
    return <p className="text-center text-muted-foreground">No data found</p>;

  const user = data.userByName;

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" passHref>
            <Button variant="outline" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user.iconUrl || undefined}
                  alt={user.username}
                />
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <h2 className="text-xl font-bold">{user.username}</h2>
                <p className="text-muted-foreground">{user.bio}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Users className="text-muted-foreground mr-2" size={16} />
                <span>{user.followerCount} Followers</span>
              </div>
              <div className="flex items-center">
                <UserPlus className="text-muted-foreground mr-2" size={16} />
                <span>{user.followingCount} Following</span>
              </div>
              <div className="flex items-center">
                <MessageSquare
                  className="text-muted-foreground mr-2"
                  size={16}
                />
                <span>{user.postCount} Posts</span>
              </div>
              <div className="flex items-center">
                <Calendar className="text-muted-foreground mr-2" size={16} />
                <span>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Award className="text-muted-foreground mr-2" size={16} />
                    DSCVR Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">
                    {(parseInt(user.dscvrPoints) / 1_000_000).toLocaleString()}{" "}
                    Points
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Award className="text-muted-foreground mr-2" size={16} />
                    Active Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">
                    {user.streak.dayCount} Days
                    <span className="text-sm font-normal ml-2 text-muted-foreground">
                      (x{user.streak.multiplierCount} Multiplier)
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Wallet className="text-muted-foreground mr-2" size={16} />
                    Wallets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {user.wallets.map((wallet: Wallet, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted p-2 rounded-md"
                      >
                        <span className="font-mono text-sm">
                          {wallet.address.slice(0, 6)}...
                          {wallet.address.slice(-4)}
                        </span>
                        {wallet.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
