import ProfileDetail from "../../../../components/Profiles/detail";

const ProfilePage = async ({ params }) => {
  const { id } = await params;
  return <ProfileDetail key={id} profileId={id} />;
};

export default ProfilePage;
