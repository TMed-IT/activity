import styled from "@emotion/styled";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { type User, fetchUser } from "../libs/api";
import HistoryYearMap from "./HistoryYearMap";
import HistoryMonthTable from "./HistoryMonthTable";
import useCheckin, { isInternal } from "../libs/useCheckin";
import { StatusCircle } from "./utils";

const Header = styled.header`
  margin-bottom: 24px;
`;

const H2 = styled.h2`
  font-size: 18px;
  font-weight: bold;
  margin: 0;
`;

const Message = styled.p`
  margin: 0 0 8px 0;
`;

const Status = styled.p`
  width: 100%;
  margin: 0;
  padding-left: 22px;
  white-space: nowrap;
  overflow: hidden;
`;

const LastUpdate = styled.span`
  color: #666;
`;

const H3 = styled.h3`
  font-size: 1em;
  margin: 24px 0 0 0;
`;

const ScreenName = styled.span`
  font-weight: normal;
`;

const P = styled.p`
  margin: 0 0 16px 0;
`;

const TweetAnchor = styled.a`
  color: #999;
  text-decoration: none;
  text-underline-offset: 4px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const UserPage = () => {
  const { screenName } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const usedCheckin = useCheckin();
  const {
    lastCheckin,
    thisMonthTime,
    thisMonthDays,
    checkinsPerHour,
    setCheckins,
  } = usedCheckin;

  const tweet = useCallback(() => {
    if (!user) {
      return;
    }
    let message = "";
    if (lastCheckin) {
      if (lastCheckin.active) {
        message = `${user.name}は${
          isInternal(lastCheckin.location) ? "大森" : "学外"
        }にいます`;
      } else {
        message = `${user.name}がどこにいるかは不明です`;
      }
    } else {
      message = `${user.name}の記録はありません`;
    }
    const messageWithUrl = `${message}\nhttps://activity.tmedit.org/@${user.screenName}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      messageWithUrl
    )}`;
    window.open(url, "_blank");
  }, [user, lastCheckin, screenName]);

  useEffect(() => {
    (async () => {
      if (!screenName || !screenName.startsWith("@")) {
        return;
      }
      const result = await fetchUser(screenName.slice(1));
      if (result.type === "success") {
        setUser(result.value);
        setCheckins(result.value.checkins);
      } else {
        navigate("/");
      }
    })();
  }, [location]);

  return (
    <main>
      <Header>
        <H2>
          {user?.name}
          <ScreenName>（@{user?.screenName}）</ScreenName>
        </H2>
        <Message>{user?.message}</Message>
        <Status>
          {lastCheckin ? (
            lastCheckin.active ? (
              <>
                <StatusCircle
                  status={
                    isInternal(lastCheckin.location) ? "internal" : "others"
                  }
                />
                現在：
                {isInternal(lastCheckin.location) ? "大森" : "学外"}
                <br />
                <LastUpdate>最終更新：{lastCheckin.date}</LastUpdate>
                <TweetAnchor onClick={tweet}>（ツイート）</TweetAnchor>
              </>
            ) : (
              <>
                <StatusCircle status="inactive" />
                現在：不明
                <br />
                <LastUpdate>
                  最終更新：
                  {isInternal(lastCheckin.location)
                    ? "大森"
                    : "学外"} ／ {lastCheckin.date}
                  <TweetAnchor onClick={tweet}>（ツイート）</TweetAnchor>
                </LastUpdate>
              </>
            )
          ) : (
            <>
              <StatusCircle status="inactive" />
              記録なし<TweetAnchor onClick={tweet}>（ツイート）</TweetAnchor>
            </>
          )}
        </Status>
      </Header>

      <H3>いっかげつのきろく</H3>
      <P>
        今月は {thisMonthTime} 時間（{thisMonthDays} 日）大学にいました
      </P>
      <HistoryMonthTable checkinsPerHour={checkinsPerHour} />

      <H3>ことしのきろく</H3>
      <HistoryYearMap usedCheckin={usedCheckin} />
    </main>
  );
};

export default UserPage;
