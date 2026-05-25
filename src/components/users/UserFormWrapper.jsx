import React from 'react';
import UserFormSimple from './UserFormSimple';

const UserFormWrapper = (props) => {
  // Simply pass all props to the simplified form
  return <UserFormSimple {...props} />;
};

export default UserFormWrapper; 