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
      bg: "bg-[#EAF1FF]",
      text: "text-[#3157D5]",
      border: "border-[#3157D5]/20",
    },
  },
  {
    name: "Riya Garg",
    role: "Core Member",
    uid: "24bai70494",
    initials: "RG",
    colorScheme: {
      bg: "bg-[#E6F5EF]",
      text: "text-[#16845B]",
      border: "border-[#16845B]/20",
    },
  },
  {
    name: "Tanmay Bhardwaj",
    role: "Core Member",
    uid: "24bcs10727",
    initials: "TB",
    colorScheme: {
      bg: "bg-[#F3E8FF]",
      text: "text-[#7E22CE]",
      border: "border-[#7E22CE]/20",
    },
  },
  {
    name: "Jasmeen",
    role: "Core Member",
    uid: "24bai70497",
    initials: "J",
    colorScheme: {
      bg: "bg-[#FFF7ED]",
      text: "text-[#C2410C]",
      border: "border-[#C2410C]/20",
    },
  },
  {
    name: "Radhika Bansal",
    role: "Core Member",
    uid: "24bai70496",
    initials: "RB",
    colorScheme: {
      bg: "bg-[#FDF2F8]",
      text: "text-[#BE185D]",
      border: "border-[#BE185D]/20",
    },
  },
];
