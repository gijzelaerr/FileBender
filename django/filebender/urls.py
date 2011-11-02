from django.conf.urls.defaults import *
from django.conf import settings

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    (r'^bigfiles/', include('bigfiles.urls')),
    (r'^admin/', include(admin.site.urls)),


    (r'^accounts/login/$', 'django.contrib.auth.views.login'),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout'),
    (r'^$', include('bigfiles.urls')),
)

if settings.USE_SAML2:
    urlpatterns += patterns('',
        (r'^saml2/', include('djangosaml2.urls')),
        (r'^idp/', include('saml2idp.urls')),
        (r'^sp/', include('saml2sp.urls')),
    )

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
        (r'^storage/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STORAGE_ROOT}),

    )
