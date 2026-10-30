export interface TeamMember {
  name: string;
  role: string;
  uid: string;
  initials: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
  };
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Deepak",
    role: "Team Leader",
    uid: "24bcs10812",
    initials: "D",
    colorScheme: {
      bg: "bg-[#FFF7F7]",
      text: "text-[#C62828]",
      border: "border-[#C62828]/30",
    },
  },
  {
    name: "Riya Garg",
    role: "Core Member",
    uid: "24bai70494",
    initials: "RG",
    colorScheme: {
      bg: "bg-[#FFF7F7]",
      text: "text-[#8E1717]",
      border: "border-[#8E1717]/25",
    },
  },
  {
    name: "Tanmay Bhardwaj",
    role: "Core Member",
    uid: "24bcs10727",
    initials: "TB",
    colorScheme: {
      bg: "bg-[#FFF7F7]",
      text: "text-[#C62828]",
      border: "border-[#C62828]/25",
    },
  },
  {
    name: "Jasmeen",
    role: "Core Member",
    uid: "24bai70497",
    initials: "J",
    colorScheme: {
      bg: "bg-[#FFF7F7]",
      text: "text-[#8E1717]",
      border: "border-[#8E1717]/25",
    },
  },
  {
    name: "Radhika Bansal",
    role: "Core Member",
    uid: "24bai70496",
    initials: "RB",
    colorScheme: {
      bg: "bg-[#FFF7F7]",
      text: "text-[#C62828]",
      border: "border-[#C62828]/25",
    },
  },
];
