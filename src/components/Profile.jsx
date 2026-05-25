import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

const ProfileContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(
    90deg,
    rgb(172, 101, 101) 0%,
    rgb(161, 12, 57) 35%,
    rgba(0, 212, 255, 1) 100%
  );
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #fff;
  text-align: center;
`;

const ProfilePicture = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 20px;
  border: 3px solid #ffe600;
`;

const ProfileTitle = styled.h1`
  margin-bottom: 20px;
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
`;

const ProfileDetails = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
`;

const ProfileItem = styled.p`
  font-size: 1.2rem;
  margin-bottom: 10px;

  & > strong {
    color: #ffe600;
  }
`;

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    branchId: "",
    role: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/users/me", {
          headers: { "x-auth-token": localStorage.getItem("token") },
        });
        setProfile(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <ProfileContainer>
      <ProfilePicture
        src="https://via.placeholder.com/100"
        alt="Anonymous Profile"
      />
      <ProfileTitle>Welcome, {profile.username}!</ProfileTitle>
      <ProfileDetails>
        <ProfileItem>
          <strong>Username:</strong> {profile.username}
        </ProfileItem>
        <ProfileItem>
          <strong>Email:</strong> {profile.email}
        </ProfileItem>
        <ProfileItem>
          <strong>Branch ID:</strong> {profile.branchId}
        </ProfileItem>
        <ProfileItem>
          <strong>Role:</strong> {profile.role}
        </ProfileItem>
      </ProfileDetails>
    </ProfileContainer>
  );
};

export default Profile;
