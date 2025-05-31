import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { CertModule } from './cert/cert.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://kkk819:12qwaszx@cluster0.uw5n95x.mongodb.net/qit',
    ),

    AuthModule,
    UserModule,
    ConfigModule,
    CertModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
