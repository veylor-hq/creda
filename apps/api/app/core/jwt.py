from beanie import PydanticObjectId
import jwt
import datetime
from app.core.config import config

from fastapi import HTTPException, Header

from models.models import User


class FastJWT:
    def __init__(self):
        self.secret_key = config.JWT_SECRET_KEY
        self.otp_secret_key = config.JWT_SECRET_KEY + "_otp"

    async def encode(self, isOTP=False, optional_data=None, expire=None):
        if not expire:
            expire = (datetime.datetime.now() + datetime.timedelta(days=30)).timestamp()

        token_json = {"expire": expire}

        if optional_data:
            token_json.update(optional_data)
        jwt_token = jwt.encode(
            token_json,
            self.secret_key if isOTP else self.otp_secret_key,
            algorithm="HS256",
        )

        return jwt_token

    async def decode(self, payload=False, isOTP=False):
        return jwt.decode(
            payload,
            self.secret_key if isOTP else self.otp_secret_key,
            algorithms=["HS256"],
        )

    async def login_required(self, Authorization=Header("Authorization")):
        try:
            if Authorization == "Authorization":
                raise

            jwt_token = await self.decode(Authorization)

            if not isinstance(jwt_token, dict):
                raise

            if jwt_token.get("expire") < int(datetime.datetime.now().timestamp()):
                raise

            user = await User.get(PydanticObjectId(jwt_token.get("id")))

            if not user:
                raise

            if not user.email_verified:
                raise

            return user

        except Exception as e:
            raise HTTPException(status_code=401, detail="Unauthorized")