import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Link } from "react-router";

import { type UserWithLatestCheckin, fetchAllUsers } from "../libs/api";
import { StatusCircle } from "./utils";
import toho from "../assets/toho.webp";

const H3 = styled.h3`
  font-size: 1em;
  margin: 24px 0 0 0;
`;

const List = styled.ul`
  padding-left: 20px;
  list-style: none;
`;

const ListLink = styled(Link)`
  color: inherit;
  text-decoration: none;
  display: block;
  padding: 4px 0;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const Canvas = styled.canvas`
  width: 100%;
`;

const grayToIndex = (gray: number) => {
  if (gray < 0.18) {
    return 0;
  }
  if (gray < 0.35) {
    return 1;
  }
  if (gray < 0.55) {
    return 2;
  }
  if (gray < 0.75) {
    return 3;
  }
  if (gray < 0.95) {
    return 4;
  }
  return 5;
};

const TopPage = () => {
  const [allUsers, setAllUsers] = useState<UserWithLatestCheckin[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      const result = await fetchAllUsers();
      if (result.type === "success") {
        setAllUsers(result.value);
      }
    })();
  }, [location]);

  useEffect(() => {
    (async () => {
      const targetCanvas = canvasRef.current;
      if (!targetCanvas) {
        return;
      }
      const targetScale = 300;
      targetCanvas.width = 5 * targetScale;
      targetCanvas.height = 2 * targetScale;
      const targetCtx = targetCanvas.getContext("2d");
      if (!targetCtx) {
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const orgScale = 30;
        canvas.width = 5 * orgScale;
        canvas.height = 2 * orgScale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          return;
        }
        const data = imageData.data;
        const fontSize = Math.floor(targetCanvas.width / canvas.width);
        targetCtx.font = `${fontSize}px "Noto Sans Mono"`;

        const charMap = ["東", "邦", "#", "?", "–", " "];

        // アスキーアートに変換
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
            const d = grayToIndex(gray);
            const char = charMap[d];
            const x0 = (targetCanvas.width / canvas.width) * x;
            const y0 = (targetCanvas.height / canvas.height) * y;
            targetCtx.fillText(char, x0, y0);
          }
        }
      };

      img.src = toho;
    })();
  }, []);

  return (
    <main>
      <Canvas ref={canvasRef} />
      <H3>みんなのきろく</H3>
      <List>
        {allUsers.map((user) => {
          const status =
            user.latestLocationId === "uomori"
              ? "internal"
              : user.latestLocationId === "others"
              ? "others"
              : "inactive";
          const statusText =
            status === "internal"
              ? "大森"
              : status === "others"
              ? "学外"
              : "不明";
          return (
            <li key={user.id}>
              <ListLink to={`/@${user.screenName}`}>
                <StatusCircle status={status} />
                {user.name}（@{user.screenName}） 現在：
                {statusText}
              </ListLink>
            </li>
          );
        })}
      </List>
    </main>
  );
};

export default TopPage;
