from django.conf import settings # import the settings file


def auth_urls(context):
    return {
             'LOGIN_URL': settings.LOGIN_URL,
             'LOGOUT_URL': settings.LOGOUT_URL
             }

def storage(context):
    return {
             'STORAGE_ROOT': settings.STORAGE_ROOT,
             'STORAGE_URL': settings.STORAGE_URL
             }

