import { ContactConfig } from '../types/stadium';

export const CONTACT_CONFIG: ContactConfig = {
  generalLeaders: [
    { role: '중앙집행위원장', name: '박준혁', phone: '010-4234-6859', dept: '총괄' },
    { role: '대외협렵국장', name: '서영서', phone: '010-9876-5432', dept: '총괄' },
  ],
  deptLeads: [
    { role: '매뉴얼 / 수송 TF', name: '양광모', phone: '010-2222-3333', dept: '운영기획' },
    { role: '공연 / 무대 TF', name: '이희재', phone: '010-4444-5555', dept: '무대연출' },
    { role: '종목 / e스포츠 TF', name: '김태승', phone: '010-7777-8888', dept: '경기운영' },
    { role: '디자인 / 홍보 TF', name: '박지은', phone: '010-9999-0000', dept: '디자인' },
  ],
  links: {
    kakaoOpenChat: 'https://open.kakao.com/o/stadium2026',
    instagram: 'https://instagram.com/postech_stadium',
    youtube: 'https://youtube.com/@stadium_official',
  },
};
