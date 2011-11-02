from string import hexdigits
from random import choice
import datetime

from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


# TODO: collision possible, this could be concatenated with bigfileid
def secret_generator(size=settings.FILE_SECRET_LENGTH):
    return "".join([choice(hexdigits) for i in range(size)])


def one_week_later(when=datetime.datetime.now()):
    return  when + datetime.timedelta(weeks=1)


class BigFile(models.Model):
    name = models.CharField(max_length=100)
    size = models.IntegerField()
    md5 = models.CharField(max_length=32)
    expire_date = models.DateTimeField(default=one_week_later)
    upload_date = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, related_name='bigfiles')
    message = models.TextField(blank=True)
    secret = models.CharField(max_length=settings.FILE_SECRET_LENGTH,
                              default=secret_generator)
    
    def __unicode__(self):
        return self.name

    def save(self, *args, **kwargs):
        super(BigFile, self).save(*args, **kwargs)


class Downloader(models.Model):
    bigfile = models.ForeignKey(BigFile, related_name="downloaders")
    email = models.EmailField()

    def __unicode__(self):
        return self.email