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

interface ProfilePictureProps {
  iconUrl: string | null;
  username: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  iconUrl,
  username,
}) => {
  const initials = username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className="w-24 h-24">
      <AvatarImage src={iconUrl || undefined} alt={username} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
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
      <div className="max-w-4xl mx-auto p-6">
        <Link href="/" passHref>
          <Button variant="link" className="mb-8">
            <ArrowLeft className="mr-2" size={20} />
            Back to Transfer
          </Button>
        </Link>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center mb-8">
              <ProfilePicture iconUrl={user.iconUrl} username={user.username} />
              <div className="ml-6">
                <h2 className="text-3xl font-bold">{user.username}</h2>
                <p className="text-muted-foreground mt-2">{user.bio}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="flex items-center">
                <Users className="text-muted-foreground mr-2" size={20} />
                <span>{user.followerCount} Followers</span>
              </div>
              <div className="flex items-center">
                <UserPlus className="text-muted-foreground mr-2" size={20} />
                <span>{user.followingCount} Following</span>
              </div>
              <div className="flex items-center">
                <MessageSquare
                  className="text-muted-foreground mr-2"
                  size={20}
                />
                <span>{user.postCount} Posts</span>
              </div>
              <div className="flex items-center">
                <Calendar className="text-muted-foreground mr-2" size={20} />
                <span>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="text-muted-foreground mr-2" size={24} />
                  DSCVR Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {(parseInt(user.dscvrPoints) / 1_000_000).toLocaleString()}{" "}
                  Points
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="text-muted-foreground mr-2" size={24} />
                  Active Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {user.streak.dayCount} Days
                  <span className="text-lg font-normal ml-2 text-muted-foreground">
                    (x{user.streak.multiplierCount} Multiplier)
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="text-muted-foreground mr-2" size={24} />
                  Wallets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.wallets.map((wallet: Wallet, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="font-mono">
                          {wallet.address.slice(0, 6)}...
                          {wallet.address.slice(-4)}
                        </span>
                        {wallet.isPrimary && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
